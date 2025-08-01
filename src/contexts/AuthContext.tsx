const fetchCurrentRep = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('reps')
      .select('*')
      .eq('auth_id', userId)  // 👈 fix: use auth_id not id
      .single();

    if (error) {
      console.error('Error fetching current rep:', error);
      setCurrentRep(null);
    } else {
      setCurrentRep(data);
    }
  } catch (error) {
    console.error('Error fetching current rep:', error);
    setCurrentRep(null);
  } finally {
    setLoading(false);
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
